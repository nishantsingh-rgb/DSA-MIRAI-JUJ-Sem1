#include <iostream>
using namespace std;

bool isPrime(int n) {
    if (n < 2) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    cout << "Primes up to 20: ";
    for (int x = 1; x <= 20; x++) {
        if (isPrime(x)) cout << x << " ";
    }
    cout << endl;
    return 0;
}
