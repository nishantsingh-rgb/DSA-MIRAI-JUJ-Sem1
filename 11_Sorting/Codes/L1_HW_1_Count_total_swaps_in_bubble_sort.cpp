#include <iostream>
#include <vector>
using namespace std;

void countBubble(vector<int> arr) {             // a copy: the caller's array is untouched
    int n = arr.size();
    int swaps = 0, comparisons = 0;
    for (int pass = 1; pass < n; pass++) {
        bool swapped = false;
        for (int j = 0; j < n - pass; j++) {
            comparisons++;
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swaps++;
                swapped = true;
            }
        }
        if (!swapped) {
            break;
        }
    }
    cout << "comparisons = " << comparisons << ", swaps = " << swaps << endl;
}

int main() {
    vector<int> a = {5, 1, 4, 2, 8};
    vector<int> b = {4, 3, 2, 1};
    vector<int> c = {1, 2, 3, 4};

    cout << "{5, 1, 4, 2, 8}: ";
    countBubble(a);
    cout << "{4, 3, 2, 1}   : ";
    countBubble(b);
    cout << "{1, 2, 3, 4}   : ";
    countBubble(c);
    return 0;
}
