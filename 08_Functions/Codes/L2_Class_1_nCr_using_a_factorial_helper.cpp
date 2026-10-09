#include <iostream>
using namespace std;

long long factorial(int n) {
    long long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

long long nCr(int n, int r) {
    return factorial(n) / (factorial(r) * factorial(n - r));
}

int main() {
    int n = 6, r = 2;
    cout << n << "C" << r << " = " << nCr(n, r) << endl;
    cout << "5C3 = " << nCr(5, 3) << endl;
    return 0;
}
