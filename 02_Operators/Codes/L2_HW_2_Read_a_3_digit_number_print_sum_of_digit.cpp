#include <iostream>
using namespace std;

int main() {
    int n;
    cout << "Enter a 3-digit number: ";
    cin >> n;

    int hundreds = n / 100;
    int tens = (n / 10) % 10;
    int units = n % 10;

    cout << "Sum of digits: " << (hundreds + tens + units) << endl;
    return 0;
}
