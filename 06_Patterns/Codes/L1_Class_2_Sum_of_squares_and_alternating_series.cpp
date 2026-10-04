#include <iostream>
using namespace std;

int main() {
    int n = 6;

    // 1^2 + 2^2 + ... + n^2
    int squares = 0;
    for (int i = 1; i <= n; i++) {
        squares += i * i;
    }

    // 1 - 2 + 3 - 4 + ... (+/-) n
    int alternating = 0;
    for (int i = 1; i <= n; i++) {
        if (i % 2 == 1) alternating += i;
        else alternating -= i;
    }

    cout << "Sum of squares up to " << n << ": " << squares << endl;
    cout << "1 - 2 + 3 - ... up to " << n << ": " << alternating << endl;
    return 0;
}
