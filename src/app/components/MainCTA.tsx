import { cta } from "@/types"

export const MainCTA = ({ link, label, description }: cta) => {
    return (
        <li className="w-24 h-24 sm:w-36 sm:h-26 md:w-42 md:h-42 rounded-md text-2xl bg-blue-400 flex justify-center items-center text-center cursor-pointer">
            <a href={link}>{label}</a>
        </li>
    )
}