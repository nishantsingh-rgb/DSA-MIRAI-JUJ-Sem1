#include <iostream>
using namespace std;

int main() {
    int n = 32;

    int addSteps = 0;
    for (int i = 1; i <= n; i += 2) {
        addSteps++;
    }

    int mulSteps = 0;
    for (int i = 1; i <= n; i *= 2) {
        mulSteps++;
    }

    cout << "N = " << n << endl;
    cout << "i += 2 ran " << addSteps << " times -> N/2 -> O(N)" << endl;
    cout << "i *= 2 ran " << mulSteps << " times -> log2(N) + 1 -> O(log N)" << endl;
    return 0;
}
