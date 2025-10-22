import { cta } from "@/types"
import { MainCTA } from "./MainCTA"

export const MainCTAs = () => {
    const ctas: cta[] = [
        {
            label: "Rides",
            description: "See if there's any group rides near you",
            link: "/rides"
        },
        {
            label: "View All Trails",
            description: "Check out your local trails and find a group ride",
            link: "/new-ride"
        },
        {
            label: "Start a Ride",
            description: "Share when and where you are riding so others can join",
            link: "/new-ride"
        },
        {
            label: "Connect with other Riders",
            description: "Check out other riders around you",
            link: "/riders"
        }
    ]
    return (
        <ul className="flex flex-col md:flex-row gap-4 md:gap-8 mx-auto">{ctas.map(cta => <MainCTA {...cta} key={cta.label} />)}</ul>
    )
}