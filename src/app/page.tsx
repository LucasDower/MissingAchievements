import Footer from './footer';
import Header from './header';
import MainPanel from './main_panel';

export default function Home() {
  return (
    <div className="h-screen flex flex-col select-none">
        <Header></Header>
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="flex h-full">
                <MainPanel></MainPanel>
            </div>
        </div>
        <Footer></Footer>
    </div>
);
}
