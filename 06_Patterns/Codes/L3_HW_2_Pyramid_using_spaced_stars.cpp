#include <iostream>
using namespace std;

int main() {
    int n = 5;

    // Each "* " is 2 characters wide, so n - i single spaces
    // are enough to center row i, which holds just i stars.
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= n - i; s++) {
            cout << " ";
        }
        for (int j = 1; j <= i; j++) {
            cout << "* ";
        }
        cout << endl;
    }
    return 0;
}
