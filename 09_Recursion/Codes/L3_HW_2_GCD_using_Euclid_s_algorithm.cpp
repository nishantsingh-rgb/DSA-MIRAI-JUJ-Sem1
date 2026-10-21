#include <iostream>
using namespace std;

int gcd(int a, int b) {
    cout << "gcd(" << a << ", " << b << ")";
    if (b == 0) {                    // gcd(a, 0) = a
        cout << endl;
        return a;
    }
    cout << " -> ";
    return gcd(b, a % b);            // gcd(a, b) = gcd(b, a % b)
}

int main() {
    int a = 48, b = 18;
    int g = gcd(a, b);
    cout << "GCD of " << a << " and " << b << " = " << g << endl;
    cout << "LCM of " << a << " and " << b << " = " << a / g * b << endl;

    g = gcd(17, 5);
    cout << "GCD of 17 and 5 = " << g << endl;
    return 0;
}
