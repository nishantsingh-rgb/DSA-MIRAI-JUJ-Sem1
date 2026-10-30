#include <iostream>
#include <vector>
using namespace std;

bool exists(const vector<int> &arr, int x) {
    for (int value : arr) {
        if (value == x) {
            return true;
        }
    }
    return false;                       // after the loop, not inside it
}

int main() {
    vector<int> arr = {11, 23, 5, 42, 17};
    int queries[] = {42, 8, 11};

    for (int q : queries) {
        if (exists(arr, q)) {
            cout << q << " exists" << endl;
        } else {
            cout << q << " does not exist" << endl;
        }
    }
    return 0;
}
