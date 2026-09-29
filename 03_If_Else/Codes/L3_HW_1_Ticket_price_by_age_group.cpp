#include <iostream>
using namespace std;

int main() {
    int age;
    cout << "Enter age: ";
    cin >> age;

    int price;
    if (age < 5) price = 0;
    else if (age >= 5 && age <= 12) price = 50;
    else if (age >= 13 && age <= 59) price = 100;
    else price = 60;

    cout << "Ticket price: Rs " << price << endl;
    return 0;
}
