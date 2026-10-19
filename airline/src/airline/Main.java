package airline;

import java.util.Scanner;

public class Main {

    public static void main(String[] args){

        Scanner sc = new Scanner(System.in);

        Flight flights[] = new Flight[100];
        int count = Flight.loadFromFile(flights);

        Boarding queue = new Boarding();
        Service services = new Service();

        int choice = 0;

        do {
            try {

                System.out.println("\n===== FLIGHT MANAGEMENT SYSTEM =====");
                System.out.println("1. Add Flight");
                System.out.println("2. Display Flights");
                System.out.println("3. Book Tickets");
                System.out.println("4. Display Passengers");
                System.out.println("5. Search Passenger");
                System.out.println("6. Delete Passenger");
                System.out.println("7. Sort Passengers by Age");
                System.out.println("8. Sort Passengers by Name");
                System.out.println("9. Search Flights by Source and Destination");
                System.out.println("10. Undo Last Deleted Passenger");
                System.out.println("11. Display Wheelchair Passengers");
                System.out.println("12. Display Food Passengers");
                System.out.println("13. Board Next Passenger");
                System.out.println("14. Display Boarding Queue");
                System.out.println("15. Allocate Gate");
                System.out.println("16. Display Gate Table");
                System.out.println("17. Exit");

                System.out.print("Enter your choice: ");
                choice = sc.nextInt();
                sc.nextLine();

                switch(choice){

                    case 1:
                        System.out.print("Flight ID: ");
                        int id = sc.nextInt();
                        sc.nextLine();

                        System.out.print("Company: ");
                        String comp = sc.nextLine();

                        System.out.print("Source: ");
                        String src = sc.nextLine();

                        System.out.print("Destination: ");
                        String dest = sc.nextLine();
                        if(src.trim().isEmpty() || dest.trim().isEmpty() ||
                        		   !src.matches("[a-zA-Z ]+") || !dest.matches("[a-zA-Z ]+")){

                        		    System.out.println("❌ Source and Destination must contain only letters!");
                        		    break;
                        		}

                        System.out.print("Departure: ");
                        String dep = sc.nextLine();

                        System.out.print("Arrival: ");
                        String arr = sc.nextLine();

                        System.out.print("Fare: ");
                        double fare = sc.nextDouble();

                        Flight nf = new Flight(id, comp, src, dest, dep, arr, fare);
                        count = Flight.addFlightSorted(flights, count, nf);
                        break;

                    case 2:
                        Flight.displayFlights(flights, count);
                        break;

                    case 3:
                        System.out.print("Enter Source: ");
                        String s = sc.nextLine();

                        System.out.print("Enter Destination: ");
                        String d = sc.nextLine();

                        Flight.searchRoute(flights, count, s, d);

                        System.out.print("Enter Flight ID: ");
                        int fid = sc.nextInt();

                        Flight f = Flight.searchFlight(flights, count, fid);

                        if(f != null){
                            System.out.print("Enter number of tickets: ");
                            int n = sc.nextInt();

                            for(int i = 1; i <= n; i++){
                                sc.nextLine();

                                System.out.print("Name: ");
                                String name = sc.nextLine();

                                System.out.print("Age: ");
                                int age = sc.nextInt();

                                Passenger p = f.addPassenger(name, age);

                                if(p != null){
                                    queue.addToBoarding(p);

                                    System.out.print("Need wheelchair? (y/n): ");
                                    char w = sc.next().charAt(0);

                                    if(w == 'y')
                                        services.addWheelchair(p, fid);

                                    System.out.print("Need food? (y/n): ");
                                    char food = sc.next().charAt(0);

                                    if(food == 'y')
                                        services.addFood(p, fid);

                                    System.out.println("Ticket Booked!");
                                }
                            }
                        }
                        else{
                            System.out.println("Flight not found!");
                        }
                        break;

                    case 4:
                        System.out.print("Flight ID: ");
                        int df = sc.nextInt();

                        Flight ff = Flight.searchFlight(flights, count, df);

                        if(ff != null)
                            ff.displayPassengers();
                        else
                            System.out.println("Flight not found!");
                        break;

                    case 5:
                        System.out.print("Flight ID: ");
                        int sf = sc.nextInt();

                        Flight fs = Flight.searchFlight(flights, count, sf);

                        if(fs != null){
                            System.out.print("Ticket: ");
                            int t = sc.nextInt();
                            fs.searchPassenger(t);
                        } else {
                            System.out.println("Flight not found!");
                        }
                        break;

                    case 6:
                        System.out.print("Flight ID: ");
                        int del = sc.nextInt();

                        Flight fd = Flight.searchFlight(flights, count, del);

                        if(fd != null){
                            System.out.print("Ticket: ");
                            int tk = sc.nextInt();
                            fd.deletePassenger(tk);
                        } else {
                            System.out.println("Flight not found!");
                        }
                        break;

                    case 7:
                        System.out.print("Flight ID: ");
                        int sa = sc.nextInt();

                        Flight fa = Flight.searchFlight(flights, count, sa);

                        if(fa != null)
                            fa.sortPassengersByAge();
                        break;

                    case 8:
                        System.out.print("Flight ID: ");
                        int sn = sc.nextInt();

                        Flight fn = Flight.searchFlight(flights, count, sn);

                        if(fn != null)
                            fn.sortPassengersByName();
                        break;

                    case 9:
                        System.out.print("Source: ");
                        String sp = sc.nextLine();

                        System.out.print("Destination: ");
                        String dp = sc.nextLine();

                        Flight.searchRoute(flights, count, sp, dp);
                        break;

                    case 10:
                        System.out.print("Flight ID: ");
                        int uf = sc.nextInt();

                        Flight fu = Flight.searchFlight(flights, count, uf);

                        if(fu != null)
                            fu.undoDeletePassenger();
                        break;

                    case 11:
                        System.out.print("Flight ID: ");
                        services.displayWheelchair(sc.nextInt());
                        break;
                        
                    case 12:
                        System.out.print("Flight ID: ");
                        services.displayFood(sc.nextInt());
                        break;

                    case 13:
                        queue.boardPassenger();
                        break;

                    case 14:
                        queue.displayBoarding();
                        break;

                    case 15:
                        System.out.print("Flight ID: ");
                        int gid = sc.nextInt();
                        sc.nextLine();

                        System.out.print("Destination: ");
                        String gdest = sc.nextLine();

                        GateHashing.allocateGate(gid, gdest);
                        break;

                    case 16:
                        GateHashing.displayGates();
                        break;

                    case 17:
                        Flight.saveToFile(flights, count);
                        System.out.println("Data saved. Exiting...");
                        break;

                    default:
                        System.out.println("Invalid choice");
                }

            } catch (Exception e) {
                System.out.println("⚠️ Invalid input or unexpected error!");
                sc.nextLine(); // clear buffer
            }

        } while(choice != 17);

        sc.close();
    }
}