import { useRide, type Ride } from "../hooks/useRide";

export const RideSummary = ({ ride }: { ride: Ride }) => {
const joinRide = () => {
    
}
    
    return (
        <>
        {ride && (
            <div>
                <h2>{ride.name}</h2>
                <p>{ride.date}</p>
                <p>{ride.notes}</p>
                <h3>Trails:</h3>
                <ul>
                    {ride.trailNames.map((trailName) => (
                        <li key={trailName}>{trailName}</li>
                    ))}
                </ul>
                <button className="" onClick={() => joinRide()}>Join Ride</button>
            </div>
        )}
        </>
    )
}