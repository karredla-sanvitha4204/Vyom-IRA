package airline;

public class Passenger {

    int ticketNumber;
    String name;
    int age;
    int seatNumber;
    Passenger link;

    public Passenger(int ticketNumber,String name,int age,int seatNumber){
        this.ticketNumber=ticketNumber;
        this.name=name;
        this.age=age;
        this.seatNumber=seatNumber;
        this.link=null;
    }

    public static Passenger sortByAgeBubble(Passenger head){

        if(head==null) return null;

        boolean swapped;

        do{
            swapped=false;
            Passenger temp=head;

            while(temp.link!=null){

                if(temp.age > temp.link.age){

                    int t=temp.age;
                    temp.age=temp.link.age;
                    temp.link.age=t;

                    String n=temp.name;
                    temp.name=temp.link.name;
                    temp.link.name=n;

                    swapped=true;
                }

                temp=temp.link;
            }

        }while(swapped);

        return head;
    }

    public static Passenger mergeSortByName(Passenger head){

        if(head==null || head.link==null)
            return head;

        Passenger middle=getMiddle(head);
        Passenger next=middle.link;
        middle.link=null;

        Passenger left=mergeSortByName(head);
        Passenger right=mergeSortByName(next);

        return merge(left,right);
    }

    static Passenger merge(Passenger a,Passenger b){

        if(a==null) return b;
        if(b==null) return a;

        Passenger result;

        if(a.name.compareToIgnoreCase(b.name)<=0){
            result=a;
            result.link=merge(a.link,b);
        }else{
            result=b;
            result.link=merge(a,b.link);
        }

        return result;
    }

    static Passenger getMiddle(Passenger head){

        if(head==null) return head;

        Passenger slow=head;
        Passenger fast=head.link;

        while(fast!=null){

            fast=fast.link;

            if(fast!=null){
                slow=slow.link;
                fast=fast.link;
            }
        }

        return slow;
    }
}