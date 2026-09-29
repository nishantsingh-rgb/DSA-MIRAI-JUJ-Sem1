#include <iostream>
#include <iomanip>
using namespace std;

int main() {
    double price;
    int quantity;

    cout << "Enter price per item: ";
    cin >> price;
    cout << "Enter quantity: ";
    cin >> quantity;

    double bill = price * quantity;

    cout << fixed << setprecision(2);
    cout << "Total bill: " << bill << endl;
    return 0;
}
