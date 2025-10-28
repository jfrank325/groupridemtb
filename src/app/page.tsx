import { MainCTAs } from "./components/MainCTAs";
import { RidesServer } from "./components/RidesServer";
import TrailMap from "./components/TrailMap";
import { TrailsServer } from "./components/TrailsServer";

export default function Home() {
  return (
      <main className="flex flex-col w-full font-inter bg-gray-50 text-gray-900 md:px-20 py-20 min-h-screen">
        <RidesServer/>
        <TrailsServer />
        {/* <MainCTAs /> */}
      </main>
  );
}
