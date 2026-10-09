#include <iostream>
using namespace std;

long long power(int base, int exp = 2) {
    long long result = 1;
    for (int i = 1; i <= exp; i++) {
        result *= base;
    }
    return result;
}

int main() {
    cout << "2^10 = " << power(2, 10) << endl;
    cout << "3^4 = " << power(3, 4) << endl;
    cout << "7^2 = " << power(7) << " (exp uses its default 2)" << endl;
    return 0;
}
