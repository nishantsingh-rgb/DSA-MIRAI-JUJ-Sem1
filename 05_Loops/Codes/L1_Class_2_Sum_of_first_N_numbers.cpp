#include <iostream>
using namespace std;

int main() {
    int n = 20;
    int sum = 0;

    for (int i = 1; i <= n; i++) {
        sum += i;
    }

    cout << "Sum of first " << n << " numbers: " << sum << endl;
    return 0;
}
