#include <iostream>
using namespace std;

int main() {
    int n = 8;

    // O(N): add 1 + 2 + ... + n one number at a time
    int loopSum = 0, loopSteps = 0;
    for (int i = 1; i <= n; i++) {
        loopSum += i;
        loopSteps++;
    }

    // O(1): one formula, no matter how big n is
    int formulaSum = n * (n + 1) / 2;
    int formulaSteps = 1;

    cout << "Loop sum = " << loopSum << " in " << loopSteps << " steps -> O(N)" << endl;
    cout << "Formula sum = " << formulaSum << " in " << formulaSteps << " step -> O(1)" << endl;
    return 0;
}
