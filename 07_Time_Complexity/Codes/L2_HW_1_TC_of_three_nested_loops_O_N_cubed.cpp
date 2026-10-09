#include <iostream>
using namespace std;

int main() {
    int n = 3;
    int count = 0;

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            for (int k = 1; k <= n; k++) {
                count++;
            }
        }
    }

    cout << "N = " << n << endl;
    cout << "Innermost body ran " << count << " times" << endl;
    cout << "N * N * N = " << n * n * n << ", so TC = O(N^3)" << endl;
    return 0;
}
