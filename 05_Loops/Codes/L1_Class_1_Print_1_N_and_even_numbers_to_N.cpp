#include <iostream>
using namespace std;

int main() {
    int n = 10;

    cout << "Numbers 1 to " << n << ": ";
    for (int i = 1; i <= n; i++) {
        cout << i << " ";
    }
    cout << endl;

    cout << "Even numbers up to " << n << ": ";
    for (int i = 2; i <= n; i += 2) {
        cout << i << " ";
    }
    cout << endl;
    return 0;
}
