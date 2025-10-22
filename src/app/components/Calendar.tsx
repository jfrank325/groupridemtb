import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';


export const Calendar = ({ events }: { events: { title: string; date: string }[] }) => {
    return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventClick={(info) => alert(`Clicked on: ${info.event.title}`)}
      height="auto"
    />
    )
}