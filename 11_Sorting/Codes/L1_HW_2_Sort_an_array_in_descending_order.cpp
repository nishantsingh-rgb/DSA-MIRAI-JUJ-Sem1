#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> arr = {3, 9, 1, 7, 5};
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] < arr[j + 1]) {          // < instead of > : bigger goes first
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) {
            break;
        }
    }

    cout << "Descending: ";
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
    return 0;
}
