package airline;
	import java.util.Random;

	public class GateHashing {

	    static class Gate {

	        int flightId;
	        int gateNumber;
	        String destination;
	        Gate next;

	        Gate(int flightId, int gateNumber, String destination) {
	            this.flightId = flightId;
	            this.gateNumber = gateNumber;
	            this.destination = destination;
	            this.next = null;
	        }
	    }

	    static Gate[] gateTable = new Gate[10];
	    static Random rand = new Random();

	    // Division Hash
	    public static int divisionHash(int key) {
	        return key % gateTable.length;
	    }

	    // Allocate Gate
	    public static void allocateGate(int flightId, String destination) {

	        int gateNumber = 1 + rand.nextInt(20);

	        int index = divisionHash(flightId);

	        Gate g = new Gate(flightId, gateNumber, destination);

	        if (gateTable[index] == null) {

	            gateTable[index] = g;

	        } else {

	            Gate temp = gateTable[index];

	            while (temp.next != null)
	                temp = temp.next;

	            temp.next = g;
	        }

	        System.out.println("\nGate Allocated Successfully");
	        System.out.println("Gate Number: " + gateNumber);
	        System.out.println("Stored Index: " + index);
	    }

	    public static void displayGates() {

	        System.out.println("\n===== GATE TABLE =====");

	        for (int i = 0; i < gateTable.length; i++) {

	            System.out.print("Index " + i + " -> ");

	            Gate temp = gateTable[i];

	            while (temp != null) {

	                System.out.print(
	                        "Flight:" + temp.flightId +
	                        " Gate:" + temp.gateNumber +
	                        " (" + temp.destination + ") -> "
	                );

	                temp = temp.next;
	            }

	            System.out.println("null");
	        }
	    }
	}

