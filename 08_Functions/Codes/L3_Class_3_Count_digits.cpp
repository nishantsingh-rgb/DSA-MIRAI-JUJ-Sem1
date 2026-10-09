#include <iostream>
using namespace std;

int countDigits(int n) {
    if (n == 0) return 1;
    int count = 0;
    while (n > 0) {
        count++;
        n /= 10;
    }
    return count;
}

int main() {
    cout << "Digits in 0 = " << countDigits(0) << endl;
    cout << "Digits in 7 = " << countDigits(7) << endl;
    cout << "Digits in 90210 = " << countDigits(90210) << endl;
    return 0;
}
