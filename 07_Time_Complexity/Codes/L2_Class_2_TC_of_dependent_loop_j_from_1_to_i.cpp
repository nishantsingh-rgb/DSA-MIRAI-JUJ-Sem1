#include <iostream>
using namespace std;

int main() {
    int n = 5;
    int count = 0;

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            count++;
        }
    }

    cout << "N = " << n << endl;
    cout << "Inner body ran " << count << " times" << endl;
    cout << "1 + 2 + ... + N = N(N+1)/2 = " << n * (n + 1) / 2 << endl;
    cout << "Dropping constants, TC = O(N^2)" << endl;
    return 0;
}
