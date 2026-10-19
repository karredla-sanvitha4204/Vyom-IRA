package airline;

import java.util.LinkedList;
import java.util.Queue;

public class Boarding {

    Queue<Passenger> boardingQueue = new LinkedList<>();

    public void addToBoarding(Passenger p)
    {
        boardingQueue.add(p);
        System.out.println("Passenger added to boarding queue: " + p.name);
    }

    public void boardPassenger()
    {
        if(boardingQueue.isEmpty())
        {
            System.out.println("No passengers in boarding queue.");
            return;
        }

        Passenger p = boardingQueue.remove();

        System.out.println("\nPassenger Boarded Successfully");

        System.out.printf("%-10s %-20s %-10s %-10s\n",
                "Ticket","Name","Age","Seat");

        System.out.println("-----------------------------------------------");

        System.out.printf("%-10d %-20s %-10d %-10d\n",
                p.ticketNumber,
                p.name,
                p.age,
                p.seatNumber);
    }

    public void displayBoarding()
    {
        if(boardingQueue.isEmpty())
        {
            System.out.println("Boarding queue is empty.");
            return;
        }

        System.out.println("\n============= BOARDING QUEUE =============");

        System.out.printf("%-10s %-20s %-10s %-10s\n",
                "Ticket","Name","Age","Seat");

        System.out.println("-----------------------------------------------");

        for(Passenger p : boardingQueue)
        {
            System.out.printf("%-10d %-20s %-10d %-10d\n",
                    p.ticketNumber,
                    p.name,
                    p.age,
                    p.seatNumber);
        }

        System.out.println("=============================================");
    }
}