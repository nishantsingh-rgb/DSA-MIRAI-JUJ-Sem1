#include <iostream>
using namespace std;

int main() {
    int arr[6] = {7, 3, 9, 4, 1, 8};
    int n = 6;

    // Best case: the target is the very first element
    int target = 7, comparisons = 0;
    for (int i = 0; i < n; i++) {
        comparisons++;
        if (arr[i] == target) break;
    }
    cout << "Searching " << target << ": " << comparisons << " comparison(s) -> best case, Omega(1)" << endl;

    // Worst case: the target is the last element
    target = 8;
    comparisons = 0;
    for (int i = 0; i < n; i++) {
        comparisons++;
        if (arr[i] == target) break;
    }
    cout << "Searching " << target << ": " << comparisons << " comparison(s) -> worst case, O(N)" << endl;

    cout << "Bounds differ, so linear search has no single Theta for all inputs" << endl;
    return 0;
}
