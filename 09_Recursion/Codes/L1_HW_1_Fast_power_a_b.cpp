#include <iostream>
using namespace std;

int calls = 0;   // counts how many times power() runs

long long power(long long a, int b) {
    calls++;
    if (b == 0) return 1;                  // a^0 = 1
    long long half = power(a, b / 2);      // solve the half problem ONCE
    if (b % 2 == 0) return half * half;    // even: a^b = (a^(b/2))^2
    return half * half * a;                // odd: one extra a
}

int main() {
    calls = 0;
    cout << "2^10 = " << power(2, 10) << " (calls made: " << calls << ")" << endl;
    calls = 0;
    cout << "3^5 = " << power(3, 5) << " (calls made: " << calls << ")" << endl;
    calls = 0;
    cout << "2^30 = " << power(2, 30) << " (calls made: " << calls << ")" << endl;
    calls = 0;
    cout << "7^0 = " << power(7, 0) << " (calls made: " << calls << ")" << endl;
    return 0;
}
