import { MainCTAs } from "./components/MainCTAs";
import { RidesServer } from "./components/RidesServer";
import { Map } from "./components/Map";

export default function Home() {
  return (
      <main className="flex flex-col w-full font-inter bg-gray-50 text-gray-900 md:px-20 py-20 min-h-screen">
        <RidesServer/>
        {/* <Map /> */}
        <MainCTAs />
      </main>
  );
}
