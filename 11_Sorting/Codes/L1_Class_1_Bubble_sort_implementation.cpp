#include <iostream>
#include <vector>
using namespace std;

void printArray(const vector<int> &arr) {
    for (int x : arr) {
        cout << x << " ";
    }
    cout << endl;
}

void bubbleSort(vector<int> &arr) {
    int n = arr.size();
    for (int pass = 1; pass < n; pass++) {
        bool swapped = false;
        for (int j = 0; j < n - pass; j++) {     // last pass-1 items are final
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        cout << "  after pass " << pass << ": ";
        printArray(arr);
        if (!swapped) {                          // early exit
            cout << "  no swaps in this pass - already sorted, stop" << endl;
            break;
        }
    }
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8};
    cout << "Sorting: ";
    printArray(a);
    bubbleSort(a);

    vector<int> b = {1, 2, 3, 4, 5};
    cout << "Sorting: ";
    printArray(b);
    bubbleSort(b);
    return 0;
}
