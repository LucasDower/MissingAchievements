import Footer from './footer';
import Header from './header';
import MainPanel from './main_panel';
import 'dotenv/config';

export default function Home() {
  return (
    <div className="h-screen flex flex-col select-none">
        <Header></Header>
        <div className="flex flex-col h-full">
            <div className="flex h-full">
                  <MainPanel urlBase={process.env.MA_URL!}></MainPanel>
            </div>
        </div>
        <Footer></Footer>
    </div>
);
}
