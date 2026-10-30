#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {7, 12, 5, 18, 21, 4, 9};
    int evens = 0, odds = 0;

    for (int x : arr) {
        if (x % 2 == 0) {
            evens++;
        } else {
            odds++;
        }
    }
    cout << "Even count = " << evens << endl;
    cout << "Odd count  = " << odds << endl;
    cout << "Total      = " << evens + odds << endl;
    return 0;
}
