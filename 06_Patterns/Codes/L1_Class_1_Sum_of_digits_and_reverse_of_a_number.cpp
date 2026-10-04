#include <iostream>
using namespace std;

int main() {
    int n = 4527;
    int temp = n, sum = 0, reversed = 0;

    while (temp > 0) {
        int digit = temp % 10;
        sum += digit;
        reversed = reversed * 10 + digit;
        temp /= 10;
    }

    cout << "Number: " << n << endl;
    cout << "Sum of digits: " << sum << endl;
    cout << "Reversed: " << reversed << endl;
    return 0;
}
