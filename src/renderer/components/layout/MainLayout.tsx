import { Outlet } from "react-router-dom";
import TopMenuBar from "@/features/navigation/TopMenuBar";
import LeftSidebar from "@/features/navigation/LeftSidebar";
import RightSidebar from "@/features/navigation/RightSidebar";
import BottomToolbar from "@/features/canvas/BottomToolbar";
import { useAppStore } from "@/lib/store/index";

const MainLayout: React.FC = () => {
    const currentImage = useAppStore((state) => state.currentImage);

    return (
        <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
            <TopMenuBar />
            <div className="flex flex-1 pt-10 h-screen overflow-hidden">
                <LeftSidebar />
                <main className="flex-1 relative bg-background overflow-hidden flex flex-col">
                    {/* Grid Overlay can go here */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                        style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                    </div>

                    <Outlet />

                    {currentImage && <BottomToolbar />}
                </main>
                <RightSidebar />
            </div>
        </div>
    );
};

export default MainLayout;
