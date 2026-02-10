
def perform_overnight_analysis():
    logger.info("Checking Overnight Analysis status...")
    today_str = date.today().isoformat()
    
    try:
        # Check if already done today
        row = con.execute("SELECT value FROM system_status WHERE key='last_overnight_analysis'").fetchone()
        if row and row[0] == today_str:
            logger.info("Overnight analysis already completed for today.")
            return

        logger.info("Starting Overnight Analysis (50 DMA, Swing, Beta)...")
        
        # 1. Fetch SPY Data (Benchmark)
        # We need approx 100 days to be safe for 50 trading days + returns
        end_date = date.today().isoformat()
        start_date = (date.today() - pd.Timedelta(days=150)).isoformat()
        
        spy_aggs = []
        try:
            spy_aggs = list(client.get_aggs("SPY", 1, "day", start_date, end_date))
        except Exception as e:
            logger.error(f"Failed to fetch SPY data for Beta calc: {e}")
            return

        if not spy_aggs or len(spy_aggs) < 50:
            logger.warning("Insufficient SPY data for analysis.")
            return

        # Sort and take last 51 for 50 returns
        spy_aggs.sort(key=lambda x: x.timestamp)
        spy_aggs = spy_aggs[-51:] 
        
        spy_closes = [a.close for a in spy_aggs]
        spy_df = pd.DataFrame({'close': spy_closes})
        spy_df['return'] = spy_df['close'].pct_change()
        spy_var = spy_df['return'].var()

        logger.info(f"SPY Baseline loaded. Variance: {spy_var:.6f}")

        # 2. Analyze all tickers
        updates = []
        
        # Helper to process one ticker (can be parallelized but keep simple for now)
        for ticker in stocks:
            try:
                # Fetch data
                aggs = list(client.get_aggs(ticker, 1, "day", start_date, end_date))
                if not aggs or len(aggs) < 50:
                    continue
                
                # Sort and take last 50
                aggs.sort(key=lambda x: x.timestamp)
                target_aggs = aggs[-50:]
                
                # 1. 50 DMA
                closes = [a.close for a in target_aggs]
                dma_50 = sum(closes) / len(closes)
                
                # 2. Swing Avg
                highs = [a.high for a in target_aggs]
                lows = [a.low for a in target_aggs]
                swings = [(h - l) for h, l in zip(highs, lows)]
                swing_avg = sum(swings) / len(swings)
                
                # 3. Beta
                beta_aggs = aggs[-51:]
                beta = 0
                if len(beta_aggs) > 1:
                    t_closes = [a.close for a in beta_aggs]
                    t_df = pd.DataFrame({'close': t_closes})
                    t_df['return'] = t_df['close'].pct_change()
                    
                    # Align lengths (simple truncation)
                    min_len = min(len(t_df), len(spy_df))
                    if min_len > 10: # Need some data points
                        cov = t_df['return'].tail(min_len).cov(spy_df['return'].tail(min_len))
                        beta = cov / spy_var if spy_var != 0 else 0

                updates.append((ticker, dma_50, swing_avg, beta, today_str))
                
            except Exception as e:
                logger.warning(f"Failed analysis for {ticker}: {e}")
                continue

        # 3. Update DB
        if updates:
            with con:
                con.executemany("INSERT OR REPLACE INTO ticker_stats (ticker, dma_50, swing_avg, beta, updated_at) VALUES (?, ?, ?, ?, ?)", updates)
                con.execute("INSERT OR REPLACE INTO system_status (key, value) VALUES ('last_overnight_analysis', ?)", (today_str,))
            logger.info(f"Overnight Analysis complete. Updated {len(updates)} tickers.")
            
    except Exception as e:
        logger.error(f"Overnight Analysis Failed: {e}")
