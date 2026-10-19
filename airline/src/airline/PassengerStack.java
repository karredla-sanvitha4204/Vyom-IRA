package airline;

import java.util.Stack;

public class PassengerStack {

    Stack<Passenger> stack=new Stack<>();

    public void push(Passenger p){
        stack.push(p);
    }

    public Passenger pop(){
        return stack.pop();
    }

    public boolean isEmpty(){
        return stack.isEmpty();
    }
}