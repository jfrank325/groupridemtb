import { MainCTAs } from "./components/MainCTAs";
import { Rides } from "./components/Rides";
import { Map } from "./components/Map";

export default function Home() {
  return (
      <main className="flex flex-col w-full font-inter bg-gray-50 text-gray-900 md:px-20 py-20 min-h-screen">
        <Rides />
        {/* <Map /> */}
        <MainCTAs />
      </main>
  );
}
