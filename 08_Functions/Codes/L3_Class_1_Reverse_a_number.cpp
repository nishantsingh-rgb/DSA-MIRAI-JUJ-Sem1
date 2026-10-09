#include <iostream>
using namespace std;

int reverseNumber(int n) {
    int reversed = 0;
    while (n > 0) {
        int digit = n % 10;
        reversed = reversed * 10 + digit;
        n /= 10;
    }
    return reversed;
}

int main() {
    cout << "Reverse of 12345 = " << reverseNumber(12345) << endl;
    cout << "Reverse of 1200 = " << reverseNumber(1200) << endl;
    return 0;
}
