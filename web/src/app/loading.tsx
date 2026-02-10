export default function Loading() {
    return (
        <div className="fixed top-[56px] md:top-[48px] left-0 w-full z-[9999]">
            <div className="h-0.5 w-full bg-transparent overflow-hidden">
                <div className="h-full bg-[var(--accent-blue)] animate-nav-loading"
                    style={{
                        width: '30%',
                        boxShadow: '0 0 10px var(--accent-blue)'
                    }}
                />
            </div>
        </div>
    );
}
