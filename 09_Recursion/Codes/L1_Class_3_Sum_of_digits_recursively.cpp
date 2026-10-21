#include <iostream>
using namespace std;

int sumOfDigits(int n) {
    if (n == 0) return 0;                    // no digits left
    return n % 10 + sumOfDigits(n / 10);     // last digit + sum of the rest
}

int main() {
    int a = 98765, b = 1004, c = 7;
    cout << "Sum of digits of " << a << " = " << sumOfDigits(a) << endl;
    cout << "Sum of digits of " << b << " = " << sumOfDigits(b) << endl;
    cout << "Sum of digits of " << c << " = " << sumOfDigits(c) << endl;
    return 0;
}
