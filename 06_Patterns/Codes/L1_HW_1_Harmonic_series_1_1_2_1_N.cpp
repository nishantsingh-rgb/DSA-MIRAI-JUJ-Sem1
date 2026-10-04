#include <iostream>
using namespace std;

int main() {
    int n = 5;
    double sum = 0;

    for (int i = 1; i <= n; i++) {
        sum += 1.0 / i;
    }

    cout << "Sum of harmonic series up to 1/" << n << " = " << sum << endl;
    return 0;
}
