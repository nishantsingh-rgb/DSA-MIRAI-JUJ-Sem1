#include <iostream>
using namespace std;

int main() {
    int n = 4;
    int count = 0;

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            count++;
        }
    }

    cout << "N = " << n << endl;
    cout << "Inner body ran " << count << " times" << endl;
    cout << "N * N = " << n * n << ", so TC = O(N^2)" << endl;
    return 0;
}
