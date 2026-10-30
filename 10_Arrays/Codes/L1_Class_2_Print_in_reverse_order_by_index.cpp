#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {10, 20, 30, 40, 50};
    int n = arr.size();

    cout << "Original order: ";
    for (int i = 0; i < n; i++) {
        cout << arr[i] << " ";
    }
    cout << endl;

    cout << "Reverse order : ";
    for (int i = n - 1; i >= 0; i--) {  // start at the last index
        cout << arr[i] << " ";
    }
    cout << endl;

    for (int i = n - 1; i >= 0; i--) {
        cout << "arr[" << i << "] = " << arr[i] << endl;
    }
    return 0;
}
