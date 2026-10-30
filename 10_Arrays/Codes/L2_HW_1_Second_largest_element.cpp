#include <iostream>
#include <climits>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {12, 35, 1, 10, 34, 35};

    int largest = INT_MIN, second = INT_MIN;
    for (int x : arr) {
        if (x > largest) {
            second = largest;           // old largest moves down
            largest = x;
        } else if (x > second && x != largest) {
            second = x;
        }
    }
    cout << "Largest        = " << largest << endl;
    if (second == INT_MIN) {
        cout << "No second largest (all values equal)" << endl;
    } else {
        cout << "Second largest = " << second << endl;
    }
    return 0;
}
