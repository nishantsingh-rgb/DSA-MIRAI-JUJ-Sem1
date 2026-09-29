#include <iostream>
using namespace std;

int main() {
    int a, b, c;
    cout << "Enter three distinct numbers: ";
    cin >> a >> b >> c;

    int largest;
    if (a > b && a > c) largest = a;
    else if (b > a && b > c) largest = b;
    else largest = c;

    cout << "Largest is " << largest << endl;
    return 0;
}
