#include <iostream>
using namespace std;

int main() {
    int n = 5834; // a 4-digit number

    int lastDigit  = n % 10;
    int firstDigit = n / 1000;

    cout << "Number      : " << n << endl;
    cout << "First digit : " << firstDigit << endl;
    cout << "Last digit  : " << lastDigit << endl;
    return 0;
}
