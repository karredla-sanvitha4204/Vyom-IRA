package airline;

public class Service
{

    class ServiceNode
    {
        Passenger passenger;
        int flightId;
        ServiceNode link;

        ServiceNode(Passenger p,int fid)
        {
            passenger=p;
            flightId=fid;
            link=null;
        }
    }

    ServiceNode wheelchairHead=null;
    ServiceNode foodHead=null;

    public void addWheelchair(Passenger p,int flightId)
    {
        ServiceNode node=new ServiceNode(p,flightId);

        if(wheelchairHead==null)
            wheelchairHead=node;
        else
        {
            ServiceNode temp=wheelchairHead;

            while(temp.link!=null)
                temp=temp.link;

            temp.link=node;
        }
    }


    public void addFood(Passenger p,int flightId)
    {
        ServiceNode node=new ServiceNode(p,flightId);

        if(foodHead==null)
            foodHead=node;
        else
        {
            ServiceNode temp=foodHead;

            while(temp.link!=null)
                temp=temp.link;

            temp.link=node;
        }
    }

    public void displayWheelchair(int flightId)
    {
        ServiceNode temp=wheelchairHead;

        boolean found=false;

        System.out.println("\n============== WHEELCHAIR SERVICE PASSENGERS ==============");

        System.out.printf("%-10s %-20s %-10s %-10s %-10s\n",
                "FlightID","Name","Age","Ticket","Seat");

        System.out.println("------------------------------------------------------------");

        while(temp!=null)
        {
            if(temp.flightId==flightId)
            {
                Passenger p=temp.passenger;

                System.out.printf("%-10d %-20s %-10d %-10d %-10d\n",
                        temp.flightId,
                        p.name,
                        p.age,
                        p.ticketNumber,
                        p.seatNumber);

                found=true;
            }

            temp=temp.link;
        }

        if(!found)
            System.out.println("No passengers opted for wheelchair service.");

        System.out.println("============================================================");
    }

    public void displayFood(int flightId)
    {
        ServiceNode temp=foodHead;

        boolean found=false;

        System.out.println("\n================ FOOD SERVICE PASSENGERS ===================");

        System.out.printf("%-10s %-20s %-10s %-10s %-10s\n",
                "FlightID","Name","Age","Ticket","Seat");

        System.out.println("------------------------------------------------------------");

        while(temp!=null)
        {
            if(temp.flightId==flightId)
            {
                Passenger p=temp.passenger;

                System.out.printf("%-10d %-20s %-10d %-10d %-10d\n",
                        temp.flightId,
                        p.name,
                        p.age,
                        p.ticketNumber,
                        p.seatNumber);

                found=true;
            }

            temp=temp.link;
        }

        if(!found)
            System.out.println("No passengers opted for food service.");

        System.out.println("============================================================");
    }
}