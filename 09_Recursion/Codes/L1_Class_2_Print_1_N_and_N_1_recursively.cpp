#include <iostream>
using namespace std;

void printIncreasing(int n) {
    if (n == 0) return;          // base case: nothing left to print
    printIncreasing(n - 1);      // first print 1 .. n-1
    cout << n << " ";            // then print n (on the way back)
}

void printDecreasing(int n) {
    if (n == 0) return;
    cout << n << " ";            // print n first (on the way down)
    printDecreasing(n - 1);      // then print n-1 .. 1
}

int main() {
    int N = 5;
    cout << "1 to N: ";
    printIncreasing(N);
    cout << endl;
    cout << "N to 1: ";
    printDecreasing(N);
    cout << endl;
    return 0;
}
