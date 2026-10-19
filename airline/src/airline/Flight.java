package airline;

import java.io.*;

public class Flight {

    int flightId;
    String company;
    String source;
    String destination;
    String dept;
    String arriv;
    double fare;

    Passenger head;

    PassengerStack deletedStack=new PassengerStack();

    static int ticketCounter=1000;
    static int seatCounter=1;

    public Flight(int flightId,String company,String source,String destination,String dept,String arriv,double fare){

        this.flightId=flightId;
        this.company=company;
        this.source=source;
        this.destination=destination;
        this.dept=dept;
        this.arriv=arriv;
        this.fare=fare;
    }

    public static void displayFlights(Flight f[], int count)
    {
        if(count == 0)
        {
            System.out.println("No flights available.");
            return;
        }

        System.out.println("\n======================================= FLIGHT LIST =======================================");

        System.out.printf("%-10s %-12s %-15s %-15s %-12s %-12s %-10s\n",
                "FlightID", "Company", "Source", "Destination", "Departure", "Arrival", "Fare");

        System.out.println("-------------------------------------------------------------------------------------------");

        for(int i = 0; i < count; i++)
        {
            System.out.printf("%-10d %-12s %-15s %-15s %-12s %-12s %-10.2f\n",
                    f[i].flightId,
                    f[i].company,
                    f[i].source,
                    f[i].destination,
                    f[i].dept,
                    f[i].arriv,
                    f[i].fare);
        }

        System.out.println("===========================================================================================\n");
    }

    public static int addFlightSorted(Flight flights[],int count,Flight newFlight){

        int i;

        for(i=count-1;i>=0 && flights[i].flightId>newFlight.flightId;i--){

            flights[i+1]=flights[i];
        }

        flights[i+1]=newFlight;
        displayFlights(flights,i);
        return count+1;
    }

    public static Flight searchFlight(Flight flights[],int count,int id){

        int low=0;
        int high=count-1;

        while(low<=high){

            int mid=(low+high)/2;

            if(flights[mid].flightId==id)
                return flights[mid];

            else if(flights[mid].flightId<id)
                low=mid+1;

            else
                high=mid-1;
        }

        return null;
    }

    public Passenger addPassenger(String name,int age){

        int ticket=ticketCounter++;
        int seat=seatCounter++;

        Passenger p=new Passenger(ticket,name,age,seat);

        if(head==null)
            head=p;
        else{

            Passenger temp=head;

            while(temp.link!=null)
                temp=temp.link;

            temp.link=p;
        }

        System.out.println("Ticket:"+ticket+" Seat:"+seat);

        return p;
    }

    public void displayPassengers()
    {
        if(head == null)
        {
            System.out.println("No passengers booked.");
            return;
        }

        System.out.println("\n============================ PASSENGER LIST =============================");

        System.out.printf("%-12s %-20s %-10s %-10s\n",
                "Ticket No", "Name", "Age", "Seat No");

        System.out.println("-------------------------------------------------------------------------");

        Passenger temp = head;

        while(temp != null)
        {
            System.out.printf("%-12d %-20s %-10d %-10d\n",
                    temp.ticketNumber,
                    temp.name,
                    temp.age,
                    temp.seatNumber);

            temp = temp.link;
        }

        System.out.println("=========================================================================\n");
    }

    public void deletePassenger(int ticket){

        Passenger temp=head;
        Passenger prev=null;

        while(temp!=null && temp.ticketNumber!=ticket){
        	prev=temp;
            temp=temp.link;
        }

        if(temp==null){
            System.out.println("Passenger not found");
            return;
        }

        deletedStack.push(temp);

        if(prev==null)
            head=temp.link;
        else
            prev.link=temp.link;

        System.out.println("Passenger deleted");
    }

    public void undoDeletePassenger(){

        if(deletedStack.isEmpty()){

            System.out.println("Nothing to undo");
            return;
        }

        Passenger p=deletedStack.pop();

        p.link=head;
        head=p;

        System.out.println("Passenger restored");
    }

    public void searchPassenger(int ticket){

        Passenger temp=head;

        while(temp!=null){

            if(temp.ticketNumber==ticket){

                System.out.println("Passenger:"+temp.name);
                return;
            }

            temp=temp.link;
        }

        System.out.println("Passenger not found");
    }

    public void sortPassengersByAge(){
        head=Passenger.sortByAgeBubble(head);
        System.out.println("Passenger list sorted by age:");
        displayPassengers();
    }

    public void sortPassengersByName(){
        head=Passenger.mergeSortByName(head);
        System.out.println("Passenger list sorted by name:");
        displayPassengers();
    }

    public static void searchRoute(Flight flights[], int count, String src, String dest)
    {
        Flight matchedFlights[] = new Flight[count];
        int k = 0;

        for(int i = 0; i < count; i++)
        {
            if(flights[i].source.equalsIgnoreCase(src) &&
               flights[i].destination.equalsIgnoreCase(dest))
            {
                matchedFlights[k++] = flights[i];
            }
        }

        if(k == 0)
        {
            System.out.println("No flights available for this route.");
            return;
        }

        sortFlightsByFareInsertion(matchedFlights, k);

        displayFlights(matchedFlights, k);
    }
    
    public static void sortFlightsByFareInsertion(Flight flights[], int count)
    {
        for(int i = 1; i < count; i++)
        {
            Flight key = flights[i];
            int j = i - 1;

            while(j >= 0 && flights[j].fare > key.fare)
            {
                flights[j + 1] = flights[j];
                j--;
            }

            flights[j + 1] = key;
        }

    }

    public static void saveToFile(Flight f[],int count){

        try{

            BufferedWriter bw=new BufferedWriter(new FileWriter("flights.txt"));

            for(int i=0;i<count;i++){

                bw.write(f[i].flightId+","+f[i].company+","+f[i].source+","+f[i].destination+","+f[i].dept+","+f[i].arriv+","+f[i].fare);
                bw.newLine();
            }

            bw.close();

        }catch(Exception e){

            System.out.println("File save error");
        }
    }

    public static int loadFromFile(Flight flights[]){

        int count=0;

        try{

            BufferedReader br=new BufferedReader(new FileReader("flights.txt"));

            String line;

            while((line=br.readLine())!=null){

                String p[]=line.split(",");

                int id=Integer.parseInt(p[0]);
                String company=p[1];
                String src=p[2];
                String dest=p[3];
                String dept=p[4];
                String arriv=p[5];
                double fare=Double.parseDouble(p[6]);

                flights[count++]=new Flight(id,company,src,dest,dept,arriv,fare);
            }

            br.close();

        }catch(Exception e){

            System.out.println("No previous file data");
        }

        return count;
    }

}