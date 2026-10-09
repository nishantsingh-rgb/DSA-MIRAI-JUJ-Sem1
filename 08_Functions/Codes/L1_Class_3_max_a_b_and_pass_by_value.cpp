#include <iostream>
using namespace std;

int getMax(int a, int b) {
    if (a > b) return a;
    return b;
}

void tryToChange(int x) {
    x = 100;   // changes only the local copy
    cout << "Inside tryToChange, x = " << x << endl;
}

int main() {
    int p = 17, q = 42;
    cout << "Max of " << p << " and " << q << " is " << getMax(p, q) << endl;

    tryToChange(p);
    cout << "After tryToChange(p), p is still " << p << endl;
    return 0;
}
